import ActionDialog from "~/components/action-dialog";
import Code from "~/components/code";
import Link from "~/components/link";
import Section, { RemoveButton, Row, RowList } from "~/components/section";
import { useI18n } from "~/utils/i18n";

import AddRecord from "../dialogs/add-record";

interface Props {
  records: { name: string; type: "A" | string; value: string }[];
  hasRecordsFile: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
}

export default function ManageRecords({ records, hasRecordsFile, isDisabled, isReadOnly }: Props) {
  const { text: ui, t } = useI18n();
  const isLocked = isDisabled || isReadOnly;

  return (
    <Section
      action={isLocked ? undefined : <AddRecord />}
      description={
        <>
          {t("dns.records.description")}{" "}
          <Link external styled to="https://headscale.net/stable/ref/dns">
            {t("common.docs")}
          </Link>
          {!isDisabled && isReadOnly && hasRecordsFile && (
            <>
              {" "}
              {ui("To edit records here, give Headplane write access to the file at")}{" "}
              <Code>dns.extra_records_path</Code>
              {ui(".")}
            </>
          )}
          {!isDisabled && isReadOnly && !hasRecordsFile && (
            <>
              {" "}
              {ui("To edit records here, move them from")} <Code>dns.extra_records</Code>{" "}
              {ui("into a JSON file set as")} <Code>dns.extra_records_path</Code>
              {ui(".")}
            </>
          )}
        </>
      }
      title={t("dns.records.title")}
    >
      {records.length === 0 ? (
        <p className="text-muted py-2.5 text-sm">{t("dns.records.empty")}</p>
      ) : (
        <RowList>
          {records.map((record) => (
            <Row
              action={
                <ActionDialog
                  description={ui("Devices stop resolving this name to the record's address.")}
                  fields={{ name: record.name, type: record.type }}
                  intent="remove_record"
                  isDestructive
                  submitLabel={ui("Remove")}
                  title={ui("Remove the {type} record for {name}?", {
                    type: record.type,
                    name: record.name,
                  })}
                  trigger={<RemoveButton disabled={isLocked} />}
                />
              }
              key={`${record.name}-${record.type}-${record.value}`}
            >
              <span className="grid grid-cols-1 gap-x-4 font-mono text-xs sm:grid-cols-2">
                <span className="break-all">{record.name}</span>
                <span className="break-all">
                  <span className="text-muted mr-2 inline-block w-8">{record.type}</span>
                  {record.value}
                </span>
              </span>
            </Row>
          ))}
        </RowList>
      )}
    </Section>
  );
}
