// This type defines the structure of each row parsed from the uploaded Excel file
export type ExcelRow = {
    company: string;        // company (entered by)
    // role: string;       // users.role (enum)
    status: string;                  // events.status (enum)
    eventTitle: string;              // events.title
    startDate: string;               // events.start_date
    venueName: string;               // venues.name
    categoryName: string;            // categories.name (enum)
    subCategoryName: string;         // sub_category.name (enum)

    // Optional fields
    endDate?: string;                // events.end_date
    totalAttendees?: number;         // events.total_attendees
    totalAttendeeCategory?: string;  // events.total_attendee_category (enum)
    details?: string;                // events.notes or events.description
    eventYear?: string;
    eventDate?: string;
    }