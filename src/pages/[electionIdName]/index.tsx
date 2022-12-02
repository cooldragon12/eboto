import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { GetServerSideProps } from "next";
import {
  candidateType,
  electionType,
  partylistType,
  positionType,
} from "../../types/typings";
import { firestore } from "../../firebase/firebase";
import { Box, Button, Container, Text } from "@chakra-ui/react";
import Head from "next/head";
import Moment from "react-moment";
import Link from "next/link";
import isElectionOngoing from "../../utils/isElectionOngoing";

interface ElectionPageProps {
  election: electionType;
  partylists: partylistType[];
  positions: positionType[];
  candidates: candidateType[];
}

const ElectionPage = ({
  election,
  partylists,
  positions,
  candidates,
}: ElectionPageProps) => {
  const pageTitle = `${election.name} - Election | eBoto Mo`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <Container maxW="8xl">
        <Text fontSize="3xl" fontWeight="bold">
          {election.name}
        </Text>
        {election.electionStartDate && election.electionEndDate && (
          <Text>
            <Moment format="MMMM DD, YYYY, h:mmA">
              {election.electionStartDate.seconds * 1000}
            </Moment>
            {" - "}
            <Moment format="MMMM DD, YYYY, h:mmA">
              {election.electionEndDate.seconds * 1000}
            </Moment>
          </Text>
        )}
        <Text>{election.about}</Text>
        {!isElectionOngoing(
          election.electionStartDate,
          election.electionEndDate
        ) ? (
          <Button disabled>Voting is not yet available</Button>
        ) : (
          <Link href={`/${election.electionIdName}/vote`}>
            <Button>Vote</Button>
          </Link>
        )}

        <Box>
          {positions.map((position) => {
            return (
              <Box key={position.id}>
                <Text fontSize="2xl">{position.title}</Text>
                <Box>
                  {candidates
                    .filter((candidate) => candidate.position === position.uid)
                    .map((candidate) => {
                      return (
                        <Link
                          href={`/${election.electionIdName}/${candidate.slug}`}
                          key={candidate.id}
                        >
                          <Text>{`${candidate.lastName}, ${
                            candidate.firstName
                          }${
                            candidate.middleName &&
                            ` ${candidate.middleName.charAt(0)}.`
                          } (${
                            partylists.find((partylist) => {
                              return partylist.uid === candidate.partylist;
                            })?.abbreviation
                          })`}</Text>
                        </Link>
                      );
                    })}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </>
  );
};

export default ElectionPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const electionSnapshot = await getDocs(
    query(
      collection(firestore, "elections"),
      where("electionIdName", "==", context.query.electionIdName)
    )
  );
  if (electionSnapshot.empty) {
    return {
      notFound: true,
    };
  }
  const positionsSnapshot = await getDocs(
    query(
      collection(
        firestore,
        "elections",
        electionSnapshot.docs[0].id,
        "positions"
      ),
      orderBy("order")
    )
  );
  const positions = positionsSnapshot.docs.map((doc) => doc.data());

  const partylistsSnapshot = await getDocs(
    query(
      collection(
        firestore,
        "elections",
        electionSnapshot.docs[0].id,
        "partylists"
      ),
      orderBy("createdAt", "asc")
    )
  );
  const partylists = partylistsSnapshot.docs.map((doc) => doc.data());

  const candidatesSnapshot = await getDocs(
    collection(
      firestore,
      "elections",
      electionSnapshot.docs[0].id,
      "candidates"
    )
  );
  const candidates = candidatesSnapshot.docs.map((doc) => doc.data());
  return {
    props: {
      election: JSON.parse(JSON.stringify(electionSnapshot.docs[0].data())),
      positions: JSON.parse(JSON.stringify(positions)) as positionType[],
      partylists: JSON.parse(JSON.stringify(partylists)) as partylistType[],
      candidates: JSON.parse(JSON.stringify(candidates)) as candidateType[],
    },
  };
};