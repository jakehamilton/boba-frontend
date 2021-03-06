import React from "react";
import Layout from "../components/Layout";
import { BoardsDisplay, PostQuote } from "@bobaboard/ui-components";
import Link from "next/link";
import { useBoardsContext } from "components/BoardContext";
import useBoos from "components/hooks/useBoos";
import moment from "moment";
import { THREAD_PATH } from "utils/router-utils";
import { useCachedLinks } from "components/hooks/useCachedLinks";

function HomePage(props: { lastUpdate?: any }) {
  const { styles } = useBoos();
  const { boardsData } = useBoardsContext();
  const { getLinkToBoard } = useCachedLinks();

  const updatesThreadUrl = `${process.env.NEXT_PUBLIC_RELEASE_THREAD_URL}/${props?.lastUpdate?.latest_post_string_id}`;
  return (
    <div className="main">
      <Layout title={`Hello!`}>
        <Layout.MainContent>
          <div className="content">
            <div className="intro">
              <div className="title">
                <h1>Welcome to BobaBoard!</h1>
              </div>
              <div className="tagline">
                "Where the bugs are funny and the people are cool" — Outdated
                Meme
              </div>
              <p>
                Remember: this is the experimental version of an experimental
                website. If you experience a problem, then stuff is likely to be{" "}
                <em>actually broken</em>.
              </p>
              <p>
                Please do report bugs, thoughts and praise (seriously, gotta
                know what's working) in the <code>#v0-report</code> discord
                channel, the <code>!bobaland</code> board or the (even more)
                anonymous feedback form in the user menu.
              </p>
              <div className="updates">
                <h2>New Stuff </h2>
                {props?.lastUpdate && (
                  <div className="last">
                    [Last Updated:{" "}
                    {moment
                      .utc(props?.lastUpdate.last_updated)
                      .format("MM/DD/YY")}
                    .{" "}
                    <Link
                      href={THREAD_PATH}
                      as={process.env.NEXT_PUBLIC_RELEASE_THREAD_URL || ""}
                    >
                      <a>Older logs.</a>
                    </Link>
                    ]
                    <PostQuote
                      createdTime={moment
                        .utc(props?.lastUpdate.last_updated)
                        .fromNow()}
                      createdTimeLink={{
                        href: updatesThreadUrl,
                      }}
                      text={props?.lastUpdate.post_content}
                      secretIdentity={{
                        name: props?.lastUpdate.secret_identity_name,
                        avatar: props?.lastUpdate.secret_identity_avatar,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="display">
              <BoardsDisplay
                boards={Object.values(boardsData)
                  .filter((board) => !board.delisted)
                  .map((board) => ({
                    slug: board.slug.replace("_", " "),
                    avatar: board.avatarUrl,
                    description: board.tagline,
                    color: board.accentColor,
                    updates: board.hasUpdates,
                    muted: board.muted,
                    link: getLinkToBoard(board.slug),
                  }))}
              />
            </div>
            {styles}
          </div>
        </Layout.MainContent>
      </Layout>
      <style jsx>{`
        .intro {
          max-width: 600px;
          margin: 0 auto;
          margin-bottom: 25px;
          line-height: 20px;
        }
        a {
          color: #f96680;
        }
        .tagline {
          font-style: italic;
          opacity: 0.9;
          margin-top: -10px;
          margin-bottom: 15px;
        }
        .intro img {
          height: 100px;
        }
        .updates {
          background-color: #1c1c1c;
          padding: 15px;
          border-radius: 25px;
          position: relative;
        }
        .updates .last {
          font-size: small;
          margin-bottom: 5px;
        }
        .updates :global(.expand-overlay) :global(svg) {
          margin-top: 15px;
        }
        .intro ul {
          list-style-position: inside;
          list-style-type: lower-greek;
          padding-left: 0px;
        }
        .intro ul ul {
          padding-left: 10px;
          list-style-type: circle;
        }
        .intro ul ul li {
          padding-bottom: 5px;
        }
        .intro ul li {
          padding-bottom: 10px;
        }
        .content {
          color: white;
          text-align: center;
          margin: 0 auto;
          padding: 20px;
          width: 100%;
          box-sizing: border-box;
          --board-display-min-size: 180px;
        }
        .display {
          max-width: 749px;
          width: 90%;
          margin: 0 auto;
        }
        .title {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        .title h1 {
          margin: 0px 5px;
          line-height: 30px;
        }
        .title img:first-child {
          width: 45px;
          height: 45px;
        }
        .title img {
          width: 50px;
          height: 50px;
          z-index: 5;
        }
        .intro .christmas {
          height: 250px;
        }
        @media only screen and (max-width: 700px) {
          .content {
            --board-display-min-size: 150px;
          }
        }
        @media only screen and (max-width: 400px) {
          h1 {
            font-size: 25px;
          }
          .content {
            --board-display-min-size: 120px;
          }
        }
      `}</style>
    </div>
  );
}

export default HomePage;
