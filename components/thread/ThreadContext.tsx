import React from "react";

import { getThreadData } from "utils/queries";
import { useQuery, useQueryClient } from "react-query";
import {
  PostType,
  ThreadType,
  CategoryFilterType,
  ThreadPostInfoType,
  ThreadCommentInfoType,
} from "types/Types";
import {
  makePostsTree,
  extractCategories,
  applyCategoriesFilter,
  makeCommentsTree,
  extractAnswersSequence,
  UNCATEGORIZED_LABEL,
} from "utils/thread-utils";
import { getThreadInBoardCache } from "utils/queries/cache";
import moment from "moment";

import debug from "debug";
import { ThreadPageDetails, usePageDetails } from "utils/router-utils";
const log = debug("bobafrontend:ThreadContext-log");
const info = debug("bobafrontend:ThreadContext-info");

export interface ThreadContextType {
  isLoading: boolean;
  isRefetching: boolean;
  defaultView: ThreadType["defaultView"] | null;
  // The root of the thread (a.k.a. the first post).
  threadRoot: PostType | null;
  // The current post targeted by the page.
  currentRoot: PostType | null;
  chronologicalPostsSequence: PostType[];
  newAnswersSequence: { postId?: string; commentId?: string }[];
  filteredRoot: PostType | null;
  parentChildrenMap: Map<string, ThreadPostInfoType>;
  postCommentsMap: Map<string, ThreadCommentInfoType>;
  filteredParentChildrenMap: Map<string, ThreadPostInfoType>;
  categories: string[];
  categoryFilterState: CategoryFilterType[];
  setCategoryFilterState: React.Dispatch<
    React.SetStateAction<{ name: string; active: boolean }[]>
  >;
  hasNewReplies: boolean;
  personalIdentity?: {
    name: string;
    avatar: string;
  };
  parentBoardSlug: string | null;
  threadId: string | null;
}

export const useThread = (props: {
  threadId: string;
  postId: string | null;
  slug: string;
  fetch?: boolean;
}): ThreadContextType => {
  if (!props.threadId || !props.slug) {
    throw new Error("useThread requires an id and a slug.");
  }
  return useThreadWithNull(props);
};

export const useThreadWithNull = ({
  threadId,
  postId,
  slug,
  fetch,
}: {
  threadId: string | null;
  postId: string | null;
  slug: string | null;
  fetch?: boolean;
}): ThreadContextType => {
  const queryClient = useQueryClient();
  const {
    data: threadData,
    isLoading: isFetchingThread,
    isFetching: isRefetching,
  } = useQuery<
    ThreadType | null,
    [
      string,
      {
        threadId: string;
      }
    ]
  >(
    ["threadData", { threadId }],
    () => {
      if (!threadId || !slug) {
        return null;
      }
      return getThreadData({ threadId });
    },
    {
      refetchOnWindowFocus: false,
      placeholderData: () => {
        if (!threadId || !slug) {
          return null;
        }
        log(
          `Searching board activity data for board ${slug} and thread ${threadId}`
        );
        return getThreadInBoardCache(queryClient, {
          slug,
          threadId,
          categoryFilter: null,
        });
      },
      staleTime: 30 * 1000,
      notifyOnChangeProps: ["data", "isLoading", "isFetching"],
      refetchOnMount: !!fetch,
      onSuccess: (data) => {
        log(`Retrieved thread data for thread with id ${threadId}`);
        info(data);
      },
    }
  );

  // Extract posts data in a format that is easily consumable by context consumers.
  const {
    root,
    parentChildrenMap,
    newAnswersSequence,
    postCommentsMap,
    chronologicalPostsSequence,
  } = React.useMemo(() => {
    info("Building posts tree from data:");
    info(threadData);
    const {
      root = null,
      parentChildrenMap = new Map(),
      postsDisplaySequence = [],
    } = threadId ? makePostsTree(threadData?.posts, threadId) : {};
    const postCommentsMap = new Map<string, ThreadCommentInfoType>();
    threadData?.posts?.forEach((post) => {
      log(`Creating comments tree for post ${postId}`);
      if (post.comments) {
        postCommentsMap.set(post.postId, makeCommentsTree(post.comments));
      }
    });

    const chronologicalPostsSequence =
      threadData?.posts.sort((post1, post2) => {
        if (moment.utc(post1.created).isBefore(moment.utc(post2.created))) {
          return -1;
        }
        if (moment.utc(post1.created).isAfter(moment.utc(post2.created))) {
          return 1;
        }
        return 0;
      }) || [];

    return {
      root,
      parentChildrenMap,
      postCommentsMap,
      chronologicalPostsSequence,
      newAnswersSequence: postsDisplaySequence
        ? extractAnswersSequence(postsDisplaySequence, postCommentsMap)
        : [],
    };
  }, [threadData, threadId]);

  // Listen to category filter changes and update data accordingly.
  const [categoryFilterState, setCategoryFilterState] = React.useState<
    CategoryFilterType[]
  >([]);
  React.useEffect(() => {
    if (!threadData) {
      if (categoryFilterState.length) {
        setCategoryFilterState([]);
      }
      return;
    }
    const currentCategories = extractCategories(threadData.posts);
    currentCategories.push(UNCATEGORIZED_LABEL);
    log(`Current categories:`);
    log(currentCategories);
    setCategoryFilterState(
      currentCategories.map((category) => ({
        name: category,
        active:
          categoryFilterState.find(
            (stateCategory) => stateCategory.name == category
          )?.active || true,
      }))
    );
  }, [threadData, threadId]);

  const {
    root: filteredRoot,
    parentChildrenMap: filteredParentChildrenMap,
  } = React.useMemo(
    () => applyCategoriesFilter(root, parentChildrenMap, categoryFilterState),
    [root, parentChildrenMap, categoryFilterState]
  );

  return {
    isLoading: isFetchingThread,
    threadRoot: root,
    currentRoot:
      !!postId && threadData
        ? (threadData.posts.find((post) => post.postId == postId) as PostType)
        : root,
    newAnswersSequence,
    filteredRoot,
    parentChildrenMap,
    filteredParentChildrenMap,
    categories: React.useMemo(() => extractCategories(threadData?.posts), [
      threadData?.posts,
    ]),
    categoryFilterState,
    setCategoryFilterState,
    postCommentsMap,
    chronologicalPostsSequence,
    defaultView: threadData?.defaultView || null,
    personalIdentity: threadData?.personalIdentity,
    isRefetching,
    hasNewReplies:
      !!threadData?.newCommentsAmount || !!threadData?.newPostsAmount,
    parentBoardSlug: threadData?.boardSlug || null,
    threadId: threadId,
  };
};

// TODO: readd mark as read.
type Subtract<T, V> = Pick<T, Exclude<keyof T, keyof V>>;
export const withThreadData = <P extends ThreadContextType>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    fetch?: boolean;
  }
) => {
  const ReturnedComponent: React.FC<Subtract<P, ThreadContextType>> = (
    props: P
  ) => {
    const { postId, slug, threadId } = usePageDetails<ThreadPageDetails>();
    // debugger;
    const threadData = useThread({
      threadId,
      postId,
      slug,
      fetch: options?.fetch,
    });
    return <WrappedComponent {...threadData} {...props} />;
  };
  ReturnedComponent.displayName = `${WrappedComponent.name}_withThreadData`;
  return ReturnedComponent;
};