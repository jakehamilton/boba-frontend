import { useQuery, useQueryClient } from "react-query";

import React from "react";
import { RealmType } from "types/Types";
import debug from "debug";
import { getCurrentRealmSlug } from "utils/location-utils";
import { getRealmData } from "utils/queries/realm";
import { useAuth } from "components/Auth";

//const log = debug("bobafrontend:contexts:RealmContext-log");
const info = debug("bobafrontend:contexts:RealmContext-info");

const RealmContext = React.createContext<
  | {
      realmData: RealmType;
      dataUpdatedAt: number;
    }
  | undefined
>(undefined);

const useRealmContext = () => {
  const context = React.useContext(RealmContext);
  if (context === undefined) {
    throw new Error(
      "useRealmContext must be used within a RealmContextProvider"
    );
  }
  return context.realmData;
};

const useRealmContextUpdatedAt = () => {
  const context = React.useContext(RealmContext);
  if (context === undefined) {
    throw new Error(
      "useRealmContext must be used within a RealmContextProvider"
    );
  }
  return context.dataUpdatedAt;
};

const useRealmSettings = () => {
  const context = React.useContext(RealmContext);
  if (context === undefined) {
    throw new Error(
      "useRealmSettings must be used within a RealmContextProvider"
    );
  }
  return context.realmData.settings;
};

const useRealmBoards = () => {
  const context = React.useContext(RealmContext);
  if (context === undefined) {
    throw new Error(
      "useRealmSettings must be used within a RealmContextProvider"
    );
  }
  return context.realmData.boards;
};

const useBoardSummary = ({ boardId }: { boardId?: string | null }) => {
  const context = React.useContext(RealmContext);
  if (context === undefined) {
    throw new Error(
      "useRealmSettings must be used within a RealmContextProvider"
    );
  }
  return context.realmData.boards.find((summary) => summary.id == boardId);
};

export const useRealmBoardId = ({
  boardSlug,
}: {
  boardSlug: string | null;
  realmSlug: string;
}) => {
  // TODO: for now we have one realm, update this to actually pass the right realm.
  const boards = useRealmBoards();

  if (!boardSlug) {
    return null;
  }
  return boards.find((board) => board.slug == boardSlug)?.id || null;
};

export const REALM_QUERY_KEY = "realmData";
const RealmContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const realmSlug = getCurrentRealmSlug();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuth();

  const { data: realmData, dataUpdatedAt } = useQuery<RealmType>(
    [REALM_QUERY_KEY, { isLoggedIn, realmSlug }],
    () => {
      info(
        `Fetching realm data for user ${isLoggedIn ? "" : "NOT "}logged in.`
      );
      return getRealmData({ realmSlug });
    },
    {
      staleTime: Infinity,
      placeholderData: () => {
        if (!isLoggedIn) {
          return;
        }
        return queryClient
          .getQueryCache()
          .find<RealmType>([REALM_QUERY_KEY, { realmSlug }], { exact: false })
          ?.state.data;
      },
      refetchInterval: 60 * 1000,
      refetchOnWindowFocus: true,
      notifyOnChangeProps: ["data", "dataUpdatedAt"],
    }
  );

  return (
    <RealmContext.Provider
      value={React.useMemo(
        () => ({
          realmData: realmData!,
          dataUpdatedAt,
        }),
        [realmData, dataUpdatedAt]
      )}
    >
      {children}
    </RealmContext.Provider>
  );
};
const MemoizedProvider = React.memo(RealmContextProvider);

export {
  MemoizedProvider as RealmContextProvider,
  useRealmContext,
  useRealmSettings,
  useRealmBoards,
  useRealmContextUpdatedAt,
  useBoardSummary,
};
