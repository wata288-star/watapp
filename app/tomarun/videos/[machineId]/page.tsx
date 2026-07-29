import { notFound } from "next/navigation";
import AppBar from "../../components/AppBar";
import VideoBrowser from "./VideoBrowser";
import { findMachine, partsForMachine, videosForMachine } from "../../lib/data";

export default async function VideoPartPage({
  params,
}: {
  params: Promise<{ machineId: string }>;
}) {
  const { machineId } = await params;
  const machine = findMachine(machineId);
  if (!machine) notFound();

  return (
    <>
      <AppBar title={machine.name} subtitle="部位から動画を選ぶ" backHref="/tomarun/videos" />
      <div className="tm-scroll">
        <VideoBrowser
          machineId={machineId}
          parts={partsForMachine(machineId)}
          videos={videosForMachine(machineId)}
        />
      </div>
    </>
  );
}
