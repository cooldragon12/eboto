import {
  Stack,
  Box,
  Flex,
  Center,
  Button,
  Container,
  Text,
} from "@mantine/core";
import type { Election } from "@prisma/client";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import Link from "next/link";
import Moment from "react-moment";
import { getServerAuthSession } from "../../server/auth";
import { prisma } from "../../server/db";
import { api } from "../../utils/api";
import { convertNumberToHour } from "../../utils/convertNumberToHour";

const ElectionPage = ({
  election,
  hasVoted,
}: {
  election: Election;
  hasVoted: boolean;
}) => {
  const positions = api.election.getElectionVotingPageData.useQuery(
    election.id,
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
    }
  );

  return (
    <Container maw="4xl">
      {positions.isLoading ? (
        <Text>Loading...</Text>
      ) : positions.isError ? (
        <Text>Error: {positions.error.message}</Text>
      ) : !positions.data ? (
        <Text>Not found</Text>
      ) : (
        <Stack spacing={8} align="center">
          <Box>
            <Text size="2xl" weight="bold">
              {election.name}
            </Text>

            <Text>
              <Moment format="MMMM DD, YYYY hA" date={election.start_date} />
              {" - "}
              <Moment format="MMMM DD, YYYY hA" date={election.end_date} />
            </Text>
            <Text>
              Open from {convertNumberToHour(election.voting_start)} to{" "}
              {convertNumberToHour(election.voting_end)}
            </Text>

            {hasVoted ? (
              <Button component={Link} href={`/${election.slug}/realtime`}>
                Realtime count
              </Button>
            ) : (
              <Button component={Link} href={`/${election.slug}/vote`}>
                Vote now!
              </Button>
            )}
          </Box>

          <Stack>
            {positions.data.map((position) => (
              <Box key={position.id}>
                <Text size="xl" weight="medium">
                  {position.name}
                </Text>

                <Flex wrap="wrap">
                  {position.candidate.map((candidate) => (
                    <Center
                      component={Link}
                      href={`/${election?.slug || ""}/${candidate.slug}`}
                      w="44"
                      h="24"
                      key={candidate.id}
                    >
                      <Text>
                        {candidate.first_name}{" "}
                        {candidate.middle_name
                          ? candidate.middle_name + " "
                          : ""}
                        {candidate.last_name} ({candidate.partylist.acronym})
                      </Text>
                    </Center>
                  ))}
                </Flex>
              </Box>
            ))}
          </Stack>
        </Stack>
      )}
    </Container>
  );
};

export default ElectionPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  if (
    !context.query.electionSlug ||
    typeof context.query.electionSlug !== "string"
  )
    return { notFound: true };

  const session = await getServerAuthSession(context);
  const electionQuery = await prisma.election.findFirst({
    where: {
      slug: context.query.electionSlug,
    },
  });

  if (!electionQuery) return { notFound: true };

  const election = {
    ...electionQuery,
    start_date: electionQuery.start_date.toISOString(),
    end_date: electionQuery.end_date.toISOString(),
    createdAt: electionQuery.createdAt.toISOString(),
    updatedAt: electionQuery.updatedAt.toISOString(),
  };

  if (election.publicity === "PRIVATE") {
    if (!session)
      return { redirect: { destination: "/signin", permanent: false } };

    const commissioner = await prisma.commissioner.findFirst({
      where: {
        electionId: election.id,
        userId: session.user.id,
      },
    });

    if (!commissioner) return { notFound: true };

    return {
      props: {
        hasVoted: true,
        election,
      },
    };
  } else if (election.publicity === "VOTER") {
    if (!session)
      return { redirect: { destination: "/signin", permanent: false } };

    const vote = await prisma.vote.findFirst({
      where: {
        voterId: session.user.id,
        electionId: election.id,
      },
    });

    if (vote) {
      return {
        props: {
          hasVoted: true,
          election,
        },
      };
    } else {
      return {
        props: {
          hasVoted: false,
          election,
        },
      };
    }
  } else if (election.publicity === "PUBLIC") {
    const vote = await prisma.vote.findFirst({
      where: {
        voterId: session?.user.id,
        electionId: election.id,
      },
    });

    return {
      props: {
        hasVoted: !!vote || !session,
        election,
      },
    };
  }

  return {
    props: {
      hasVoted: true,
      election,
    },
  };
};