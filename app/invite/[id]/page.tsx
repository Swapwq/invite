import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";
import InvitationModal from "@/app/InvitationModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { id } = await params;
  const invitations = await readDb();
  const invitation = invitations[id];

  if (!invitation) {
    notFound();
  }

  return (
    <InvitationModal
      id={invitation.id}
      targetName={invitation.targetName}
      customTitle={invitation.customTitle}
      customDescription={invitation.customDescription}
      allowDateSelection={invitation.allowDateSelection}
      allowTimeSelection={invitation.allowTimeSelection}
      customActivities={invitation.activities}
      fixedDate={invitation.fixedDate}
      fixedTime={invitation.fixedTime}
    />
  );
}
