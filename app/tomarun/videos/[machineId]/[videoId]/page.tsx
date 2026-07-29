import { notFound } from "next/navigation";
import AppBar from "../../../components/AppBar";
import Player from "./Player";
import { findMachine, findVideo } from "../../../lib/data";

export default async function VideoPlayerPage({
  params,
}: {
  params: Promise<{ machineId: string; videoId: string }>;
}) {
  const { machineId, videoId } = await params;
  const machine = findMachine(machineId);
  const video = findVideo(videoId);
  if (!machine || !video) notFound();

  return (
    <>
      <AppBar title="動画マニュアル" subtitle={machine.name} />
      <Player video={video} machineName={machine.name} />
    </>
  );
}
