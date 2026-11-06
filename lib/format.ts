const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}

// "Server AI Prod/gemma-sensei" → "gemma-sensei"
export function modelLabel(model: string) {
  return model.split("/").at(-1) || model;
}
