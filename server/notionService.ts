import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  notionVersion: "2022-06-28", // Use stable version
});

const DATABASE_ID = "27c31e83-2d41-803e-8bd1-c22a11e8d837";

// Debug function to inspect database schema
export async function inspectDatabaseSchema() {
  try {
    console.log("🔍 Inspecting database schema...");
    const response = await notion.databases.retrieve({ database_id: DATABASE_ID });
    console.log("📋 Database properties:");
    console.log(JSON.stringify(response.properties, null, 2));
    return response.properties;
  } catch (error) {
    console.error("❌ Error inspecting database:", error);
    throw error;
  }
}

export interface MembershipApplication {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  linkedin: string;
  consent: boolean;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  status: 'pending' | 'accepted' | 'rejected';
}

export async function createApplication(data: Omit<MembershipApplication, 'id' | 'submittedAt' | 'status' | 'reviewedAt' | 'reviewedBy'>): Promise<MembershipApplication> {
  try {
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        "Name": {
          title: [{ text: { content: data.name } }]
        },
        "Company": {
          rich_text: [{ text: { content: data.company } }]
        },
        "Role": {
          rich_text: [{ text: { content: data.role } }]
        },
        "Email": {
          email: data.email
        },
        "LinkedIn": {
          url: data.linkedin || ""
        },
        "Consent": {
          checkbox: data.consent
        },
        "status": {
          select: { name: "pending" }
        },
        "Submitted At": {
          date: { start: new Date().toISOString() }
        }
      }
    });

    return {
      id: response.id,
      ...data,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      status: 'pending'
    };
  } catch (error) {
    console.error('Error creating application in Notion:', error);
    throw new Error('Failed to create application');
  }
}

export async function getAllApplications(): Promise<MembershipApplication[]> {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [
        {
          property: "Submitted At",
          direction: "descending"
        }
      ]
    });

    return response.results.map((page: any) => ({
      id: page.id,
      name: page.properties["Name"]?.title[0]?.text?.content || "",
      company: page.properties["Company"]?.rich_text[0]?.text?.content || "",
      role: page.properties["Role"]?.rich_text[0]?.text?.content || "",
      email: page.properties["Email"]?.email || "",
      linkedin: page.properties["LinkedIn"]?.url || "",
      consent: page.properties["Consent"]?.checkbox || false,
      submittedAt: page.properties["Submitted At"]?.date?.start || "",
      reviewedAt: page.properties["Reviewed At"]?.date?.start || null,
      reviewedBy: page.properties["Reviewed By"]?.rich_text[0]?.text?.content || null,
      status: page.properties["status"]?.select?.name || "pending"
    }));
  } catch (error) {
    console.error('Error fetching applications from Notion:', error);
    throw new Error('Failed to fetch applications');
  }
}

export async function updateApplicationStatus(id: string, status: 'pending' | 'accepted' | 'rejected'): Promise<void> {
  try {
    await notion.pages.update({
      page_id: id,
      properties: {
        "status": {
          select: { name: status }
        }
      }
    });
  } catch (error) {
    console.error('Error updating application status in Notion:', error);
    throw new Error('Failed to update application status');
  }
}