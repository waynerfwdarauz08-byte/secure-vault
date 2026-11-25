export const audit = (
  m,
  req,
  eventType,
  outcome = "success",
  extra = {},
  transaction,
) =>
  m.Event.create(
    {
      actorId: req.user?.id ?? null,
      eventType,
      outcome,
      requestId: req.requestId,
      ...extra,
    },
    { transaction },
  );
