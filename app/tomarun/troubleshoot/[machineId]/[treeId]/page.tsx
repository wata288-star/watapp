import { notFound } from "next/navigation";
import TreeRunner from "./TreeRunner";
import { findMachine, findTopic, findTree, findVideo } from "../../../lib/data";

export default async function TreeRunPage({
  params,
}: {
  params: Promise<{ machineId: string; treeId: string }>;
}) {
  const { machineId, treeId } = await params;
  const machine = findMachine(machineId);
  const tree = findTree(treeId);
  if (!machine || !tree) notFound();

  // 結果画面から参照される動画・資料のタイトルを解決しておく
  const firstResult = Object.values(tree.results)[0];
  const video = firstResult?.videoId ? findVideo(firstResult.videoId) : undefined;
  const topic = firstResult?.docTopicId ? findTopic(firstResult.docTopicId) : undefined;

  return (
    <TreeRunner machine={machine} tree={tree} videoTitle={video?.title} topicTitle={topic?.title} />
  );
}
