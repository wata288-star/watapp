import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "../../components/AppBar";
import FavoriteButton from "./FavoriteButton";
import {
  IconAlert,
  IconChevronRight,
  IconOffline,
  IconPlaySquare,
  IconWrench,
} from "../../components/icons";
import { docTopics, findTopic, findTree, findVideo } from "../../lib/data";

export function generateStaticParams() {
  return docTopics.map((t) => ({ topicId: t.id }));
}

export default async function TopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const topic = findTopic(topicId);
  if (!topic) notFound();

  const video = topic.relatedVideoId ? findVideo(topic.relatedVideoId) : undefined;
  const tree = topic.relatedTreeId ? findTree(topic.relatedTreeId) : undefined;
  const headings = topic.blocks.filter((b) => b.type === "heading");

  return (
    <>
      <AppBar
        title={topic.chapter}
        subtitle={topic.sourceEdition}
        backHref="/tomarun/docs"
        action={<FavoriteButton initial={topic.favorite} />}
      />

      <div className="tm-scroll">
        <div className="tm-pad">
          <h1 className="tm-topic__title">{topic.title}</h1>

          <div className="tm-chips" style={{ marginTop: 10 }}>
            {topic.errorCodes.map((c) => (
              <span key={c} className="tm-badge tm-badge--red">
                {c}
              </span>
            ))}
            {topic.tags.map((t) => (
              <span key={t} className="tm-badge tm-badge--gray">
                #{t}
              </span>
            ))}
            {topic.offline ? (
              <span className="tm-badge tm-badge--green">
                <IconOffline size={12} />
                オフライン保存済み
              </span>
            ) : null}
          </div>

          {headings.length > 1 ? (
            <nav className="tm-toc" aria-label="この項目の見出し">
              <b>この項目の内容</b>
              <ul>
                {headings.map((h) => (
                  <li key={h.body}>
                    <a href={`#h-${encodeURIComponent(h.body)}`}>{h.body}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <article className="tm-topic">
            {topic.blocks.map((b, i) => {
              switch (b.type) {
                case "heading":
                  return (
                    <h2 key={i} id={`h-${encodeURIComponent(b.body)}`}>
                      {b.body}
                    </h2>
                  );
                case "text":
                  return <p key={i}>{b.body}</p>;
                case "steps":
                  return (
                    <ol key={i} className="tm-topic__steps">
                      {b.items.map((s, n) => (
                        <li key={s}>
                          <span>{n + 1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  );
                case "table":
                  return (
                    <div key={i} className="tm-topic__tablewrap">
                      <table className="tm-topic__table">
                        <thead>
                          <tr>
                            {b.head.map((h) => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {b.rows.map((row) => (
                            <tr key={row.join()}>
                              {row.map((cell) => (
                                <td key={cell}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                case "figure":
                  return (
                    <figure key={i} className="tm-topic__figure">
                      <div className="tm-topic__figurebox">
                        <span>タップで拡大（ダウンロード不可）</span>
                      </div>
                      <figcaption>{b.caption}</figcaption>
                    </figure>
                  );
                case "danger":
                  return (
                    <div key={i} className="tm-notice tm-notice--danger">
                      <IconAlert size={20} />
                      <div>
                        <b>{b.label}</b>
                        {b.body}
                      </div>
                    </div>
                  );
                case "warn":
                  return (
                    <div key={i} className="tm-notice tm-notice--warn">
                      <IconAlert size={20} />
                      <div>
                        <b>{b.label}</b>
                        {b.body}
                      </div>
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </article>

          {video || tree ? (
            <>
              <div className="tm-section-label">
                <span>関連リンク</span>
              </div>
              <div className="tm-card">
                {video ? (
                  <Link href={`/tomarun/videos/${video.machineId}/${video.id}`} className="tm-row">
                    <span className="tm-row__icon">
                      <IconPlaySquare size={20} />
                    </span>
                    <span className="tm-row__body">
                      <b>{video.title}</b>
                      <span>動画マニュアル・{video.duration}</span>
                    </span>
                    <IconChevronRight className="tm-row__chev" />
                  </Link>
                ) : null}
                {tree ? (
                  <Link
                    href={`/tomarun/troubleshoot/${tree.machineId}/${tree.id}`}
                    className="tm-row"
                  >
                    <span className="tm-row__icon">
                      <IconWrench size={20} />
                    </span>
                    <span className="tm-row__body">
                      <b>{tree.title}</b>
                      <span>トラブルシューティング・STEP {tree.depth}問</span>
                    </span>
                    <IconChevronRight className="tm-row__chev" />
                  </Link>
                ) : null}
              </div>
            </>
          ) : null}

          <p className="tm-topic__source">{topic.sourceEdition}</p>
        </div>
      </div>
    </>
  );
}
