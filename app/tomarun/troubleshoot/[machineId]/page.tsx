import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "../../components/AppBar";
import { IconAlert, IconChevronRight, IconClock, IconRecord } from "../../components/icons";
import { findMachine, treesForMachine } from "../../lib/data";

export default async function TreeListPage({
  params,
}: {
  params: Promise<{ machineId: string }>;
}) {
  const { machineId } = await params;
  const machine = findMachine(machineId);
  if (!machine) notFound();

  const list = treesForMachine(machineId);

  return (
    <>
      <AppBar
        title={machine.name}
        subtitle={`${machine.serial} ・ 症状を選択`}
        backHref="/tomarun/troubleshoot"
      />

      <div className="tm-scroll">
        <div className="tm-pad">
          {list.length > 0 ? (
            <>
              <div className="tm-section-label">
                <span>症状・エラーコードから選ぶ</span>
                <span>{list.length}件</span>
              </div>

              <div className="tm-stack">
                {list.map((t) => (
                  <Link key={t.id} href={`/tomarun/troubleshoot/${machineId}/${t.id}`} className="tm-treecard">
                    <div className="tm-treecard__head">
                      <span className="tm-treecard__icon">
                        <IconAlert size={22} />
                      </span>
                      <b>{t.title}</b>
                      <IconChevronRight />
                    </div>
                    <div className="tm-chips">
                      {t.errorCodes.map((c) => (
                        <span key={c} className="tm-badge tm-badge--red">
                          {c}
                        </span>
                      ))}
                      <span className="tm-badge tm-badge--gray">STEP {t.depth}問</span>
                    </div>
                    <div className="tm-treecard__meta">
                      <IconClock size={15} />
                      {t.version}・{t.updatedAt} 更新
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="tm-empty">
              <IconAlert size={44} />
              <b>この機体のツリーはまだありません</b>
              <p>
                対応記録を残すと、その内容からトラブルシューティングが自動生成されます。
                まずは記録を起票してください。
              </p>
            </div>
          )}

          <div className="tm-hr" />

          <Link href="/tomarun/records/new" className="tm-row tm-card tm-card--flat">
            <span className="tm-row__icon">
              <IconRecord size={20} />
            </span>
            <span className="tm-row__body">
              <b>当てはまる症状がない</b>
              <span>対応記録を起票して、メーカーに共有する</span>
            </span>
            <IconChevronRight className="tm-row__chev" />
          </Link>
        </div>
      </div>
    </>
  );
}
