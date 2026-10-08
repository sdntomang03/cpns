import { useCallback, useEffect, useRef, useState } from 'react';
import NotificationContext from './notificationContext';

const notificationIcons = {
  success: 'bi-check-lg',
  error: 'bi-exclamation-lg',
  warning: 'bi-exclamation-lg',
  info: 'bi-info-lg',
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const nextId = useRef(0);
  const confirmResolvers = useRef(new Map());

  const enqueue = useCallback((notification, resolve) => {
    const id = ++nextId.current;
    if (resolve) confirmResolvers.current.set(id, resolve);
    setNotifications((current) => [...current, { ...notification, id }]);
    return id;
  }, []);

  const notify = useCallback((message, options = {}) => {
    if (!message) return;
    enqueue({
      title: options.title || 'Informasi',
      message,
      type: options.type || 'info',
      confirmText: options.confirmText || 'Mengerti',
    });
  }, [enqueue]);

  const confirm = useCallback((message, options = {}) => new Promise((resolve) => {
    enqueue({
      title: options.title || 'Konfirmasi',
      message,
      type: options.type || 'warning',
      confirmText: options.confirmText || 'Ya, lanjutkan',
      cancelText: options.cancelText || 'Batal',
      isConfirmation: true,
    }, resolve);
  }), [enqueue]);

  const dismiss = useCallback((id, accepted = false) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
    const resolve = confirmResolvers.current.get(id);
    if (resolve) {
      confirmResolvers.current.delete(id);
      resolve(accepted);
    }
  }, []);

  const activeNotification = notifications[0];

  useEffect(() => {
    if (!activeNotification) return undefined;

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        dismiss(activeNotification.id);
      }
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [activeNotification, dismiss]);

  return (
    <NotificationContext.Provider value={{ notify, confirm }}>
      {children}
      {activeNotification ? (
        <>
          <div
            className="modal-backdrop show swal-backdrop"
            onMouseDown={() => dismiss(activeNotification.id)}
          />
          <div
            className="modal d-block swal-modal"
            tabIndex="-1"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`notification-title-${activeNotification.id}`}
            aria-describedby={`notification-message-${activeNotification.id}`}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                dismiss(activeNotification.id);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className={`modal-content swal-dialog swal-dialog-${activeNotification.type} border-0 rounded-4 shadow-lg text-center p-3`}>
                <div className="modal-body py-4 px-3">
                  <div className="swal-icon mx-auto mb-3" aria-hidden="true">
                    <i className={`bi ${notificationIcons[activeNotification.type] || notificationIcons.info}`} />
                  </div>
                  <h5 className="fw-bold mb-2" id={`notification-title-${activeNotification.id}`}>
                    {activeNotification.title}
                  </h5>
                  <p className="text-muted mb-4" id={`notification-message-${activeNotification.id}`}>
                    {activeNotification.message}
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    {activeNotification.isConfirmation ? (
                      <button
                        className="btn btn-light border rounded-pill px-4"
                        type="button"
                        onClick={() => dismiss(activeNotification.id)}
                      >
                        {activeNotification.cancelText}
                      </button>
                    ) : null}
                    <button
                      className={`btn ${activeNotification.type === 'error' ? 'btn-danger' : 'btn-primary'} rounded-pill px-4`}
                      type="button"
                      autoFocus
                      onClick={() => dismiss(activeNotification.id, true)}
                    >
                      {activeNotification.confirmText}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </NotificationContext.Provider>
  );
}
