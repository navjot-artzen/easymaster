'use client';

import { UploadedFile } from '@/types/interfaces';
import {
  Card,
  IndexTable,
  Spinner,
  BlockStack,
  Button,
  Badge,
  Icon,
} from '@shopify/polaris';
import { ArrowDownIcon, DeleteIcon } from '@shopify/polaris-icons';
import { ConfirmModal } from '../ConfirmBox';

interface UploadedFilesTableProps {
  files: UploadedFile[];
  loading: boolean;
  onUpdate: (data: { csvFileId: string; action: string }) => void;
  onDelete: (csvFileId: string) => void;
}

export function UploadedFilesTable({
  files,
  loading,
  onUpdate,
  onDelete,
}: UploadedFilesTableProps) {
  return (
    <Card>
      <IndexTable
        resourceName={{ singular: 'file', plural: 'files' }}
        itemCount={files.length}
        headings={[
          { title: 'File Name' },
          { title: 'Processed Data' },
          { title: 'Total Data' },
          { title: 'Active' },
          { title: 'Completed' },
          { title: 'Download' },
          { title: 'Issue' },
          { title: 'Action' },
        ]}
        selectable={false}
      >
        {loading ? (
          <IndexTable.Row id="loading" key="loading" position={0}>
            <IndexTable.Cell colSpan={8}>
              <BlockStack align="center" inlineAlign="center" gap="400">
                <Spinner accessibilityLabel="Loading table data..." size="large" />
              </BlockStack>
            </IndexTable.Cell>
          </IndexTable.Row>
        ) : (
          files.map((file, index) => (
            <IndexTable.Row id={file.fileName} key={file.fileName} position={index}>
              <IndexTable.Cell>{file.fileName}</IndexTable.Cell>

              <IndexTable.Cell>
                {file.processedChunks != null && file.chunkSize != null
                  ? `${file.processedChunks * file.chunkSize} records`
                  : '0 records'}
              </IndexTable.Cell>

              <IndexTable.Cell>{file?.totalRecords}</IndexTable.Cell>

              <IndexTable.Cell>
                <Badge tone={file.active ? 'success' : 'warning'}>
                  {file.active ? 'Progress' : 'In queue'}
                </Badge>
              </IndexTable.Cell>

              <IndexTable.Cell>{file.isProcessed ? 'Yes' : 'No'}</IndexTable.Cell>

              <IndexTable.Cell>
                <Button
                  url={file.url}
                  icon={ArrowDownIcon}
                  target="_blank"
                  external
                  size="slim"
                >
                  Download
                </Button>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <Badge tone={file.error ? 'warning' : 'success'}>
                  {file.error || 'No issue'}
                </Badge>
              </IndexTable.Cell>

              <IndexTable.Cell>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <ConfirmModal
                    modalTitle={file.active ? 'Stop processing?' : 'Start processing?'}
                    message={
                      file.active
                        ? 'Are you sure you want to stop processing this CSV file?'
                        : 'Do you want to start processing this CSV file?'
                    }
                    destructive={file.active}
                    onConfirm={() =>
                      onUpdate({ csvFileId: file.id, action: file.active ? 'stop' : 'start' })
                    }
                  >
                    <Button
                      disabled={file.isProcessed}
                      role="switch"
                      ariaChecked={file.active ? 'true' : 'false'}
                      size="slim"
                      tone={file.active ? 'critical' : 'success'}
                    >
                      {file.active ? 'Stop' : 'Start'}
                    </Button>
                  </ConfirmModal>

                  <ConfirmModal
                    modalTitle="Delete this file?"
                    message="Are you sure you want to permanently delete this file?"
                    destructive
                    onConfirm={() => onDelete(file.id)}
                  >
                    <Button
                      disabled={file.isProcessed}
                      size="slim"
                      tone="critical"
                      variant="tertiary"
                      icon={DeleteIcon}
                    />
                  </ConfirmModal>
                </div>
              </IndexTable.Cell>
            </IndexTable.Row>
          ))
        )}
      </IndexTable>
    </Card>
  );
}
