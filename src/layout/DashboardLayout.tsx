import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  IconButton,
  Input,
  Select,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { collection, doc, query, where } from "firebase/firestore";
import CreateElectionModal from "../components/CreateElectionModal";
import DashboardSidebar from "../components/DashboardSidebar";
import { firestore } from "../firebase/firebase";
import {
  useCollectionData,
  useCollectionDataOnce,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import Router, { useRouter } from "next/router";
import AddVoterModal from "../components/AddVoterModal";
import { UserPlusIcon } from "@heroicons/react/24/solid";
import { useRef } from "react";
import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";
import { electionType } from "../types/typings";
import { useSession } from "next-auth/react";

const DashboardLayout = ({
  children,
  title,
}: {
  children: any;
  title: string;
}) => {
  const { data: session } = useSession();

  const {
    isOpen: isOpenCreateElection,
    onOpen: onOpenCreateElection,
    onClose: onCloseCreateElection,
  } = useDisclosure();
  const {
    isOpen: isOpenAddVoter,
    onOpen: onOpenAddVoter,
    onClose: onCloseAddVoter,
  } = useDisclosure();

  const [elections, electionsLoading] = useCollectionData(
    session &&
      session.user.elections &&
      query(
        collection(firestore, "elections"),
        where("uid", "in", session.user.elections)
      )
  );

  const router = useRouter();
  const currentElection =
    elections &&
    elections.find(
      (election) => election.electionIdName === router.query.electionIdName
    );

  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <CreateElectionModal
        isOpen={isOpenCreateElection}
        onClose={onCloseCreateElection}
      />

      <AddVoterModal
        election={currentElection as electionType}
        isOpen={isOpenAddVoter}
        onClose={onCloseAddVoter}
      />

      <Flex direction="column" gap={4} padding="4" height="85vh">
        <Center columnGap={2} width="248px">
          <Select
            placeholder={
              electionsLoading
                ? !elections?.length
                  ? "Loading..."
                  : "Create election"
                : undefined
            }
            disabled={!elections?.length}
            value={router.query.electionIdName}
            onChange={(e) => {
              Router.push(
                "/" +
                  e.target.value +
                  router.pathname.split("/[electionIdName]")[1]
              );
            }}
          >
            {elections?.map((election) => (
              <option value={election.electionIdName} key={election.id}>
                {election.name}
              </option>
            ))}
          </Select>
          <IconButton
            aria-label="Add election"
            icon={<PlusIcon width="1.5rem" />}
            onClick={onOpenCreateElection}
          />
        </Center>

        <Flex borderRadius="0.25rem" gap={4} height="100%">
          <Box
            padding={4}
            backgroundColor="whiteAlpha.200"
            height="fit-content"
            width="248px"
            borderRadius="md"
          >
            <DashboardSidebar />
          </Box>

          <Stack
            padding={4}
            backgroundColor="whiteAlpha.200"
            height="100%"
            flex="1"
            borderRadius="md"
          >
            {(() => {
              switch (title) {
                case "Voters":
                  return (
                    <Flex justifyContent="space-between">
                      <Text fontSize="2xl" fontWeight="bold">
                        {title}
                      </Text>
                      <HStack>
                        <Input
                          type="file"
                          hidden
                          accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                          ref={fileRef}
                        />
                        <Tooltip label="Upload bulk voters. (.csv, .xls, .xlsx)">
                          <IconButton
                            aria-label="Edit voter"
                            icon={<ArrowUpOnSquareIcon width={24} />}
                            onClick={() => fileRef?.current?.click()}
                          />
                        </Tooltip>
                        <Button
                          onClick={onOpenAddVoter}
                          leftIcon={<UserPlusIcon width={18} />}
                          isLoading={!currentElection}
                        >
                          Add voter
                        </Button>
                      </HStack>
                    </Flex>
                  );
                default:
                  return (
                    <Text fontSize="2xl" fontWeight="bold">
                      {title}
                    </Text>
                  );
              }
            })()}

            <Divider />
            <Box paddingTop={2}>{children}</Box>
          </Stack>
        </Flex>
      </Flex>
    </>
  );
};

export default DashboardLayout;
