import { Authenticator } from "@aws-amplify/ui-react";
import Items from "./Items.jsx";

// Authenticator shows the sign-in / sign-up screens. Its children (and so
// the API calls to Lambda) only render after the user has signed in.
export default function App() {
  return (
    <div className="page">
      <Authenticator loginMechanisms={["email"]}>
        {({ signOut, user }) => (
          <Items email={user?.signInDetails?.loginId} signOut={signOut} />
        )}
      </Authenticator>
    </div>
  );
}
