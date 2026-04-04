function ConfirmModal({ actionLabel, description, isOpen, onCancel, onConfirm, title }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-card modal-card--confirm">
        <div className="modal-card__header">
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </div>

        <div className="modal-card__actions">
          <button className="modal-card__ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-card__danger" type="button" onClick={onConfirm}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
