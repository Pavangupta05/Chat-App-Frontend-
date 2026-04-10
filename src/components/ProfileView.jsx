import { useOutletContext, useSearchParams } from "react-router-dom";
import ProfilePanel from "./ProfilePanel";

function ProfileView() {
  const context = useOutletContext();
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.get("edit") === "true";
  
  return (
    <ProfilePanel 
      isOpen={true}
      isRouted={true}
      editMode={isEditing}
      onClose={context.onClosePanel}
    />
  );
}


export default ProfileView;

