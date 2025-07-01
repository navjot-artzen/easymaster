import { useState, useCallback, ReactNode } from 'react';
import { Modal, Button, TextContainer } from '@shopify/polaris';

interface ConfirmModalProps {
  title?: string;
  modalTitle?: string;
  message?: string;
  onConfirm: () => Promise<void> | void;
  destructive?: boolean;
  children?: ReactNode; // Optional custom trigger
}

export function ConfirmModal({
  title = 'Open',
  modalTitle = 'Are you sure?',
  message = 'This action cannot be undone.',
  onConfirm,
  destructive = false,
  children,
}: ConfirmModalProps) {
  const [active, setActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = useCallback(() => setActive(true), []);
  const handleClose = useCallback(() => {
    if (!isLoading) setActive(false);
  }, [isLoading]);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setActive(false);
    } catch (error) {
      console.error('Confirm action failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm]);

  return (
    <>
      {children ? (
        <div onClick={handleOpen} style={{ display: 'inline-block', cursor: 'pointer' }}>
          {children}
        </div>
      ) : (
        <Button onClick={handleOpen}>{title}</Button>
      )}

      <Modal
        open={active}
        onClose={handleClose}
        title={modalTitle}
        primaryAction={{
          content: 'Confirm',
          onAction: handleConfirm,
          destructive,
          loading: isLoading,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handleClose,
            disabled: isLoading,
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>{message}</TextContainer>
        </Modal.Section>
      </Modal>
    </>
  );
}
