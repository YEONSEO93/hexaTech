export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const formattedDate = new Intl.DateTimeFormat("en-AU").format(date);

  return formattedDate;
}
