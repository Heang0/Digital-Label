"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function DebugAuth() {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;

      if (!user) {
        setInfo({ error: "No authenticated user" });
        return;
      }

      const paths = [
        ["users", user.uid],
        ["vendors", user.uid],
        ["profiles", user.uid],
        ["accounts", user.uid],
      ];

      for (const [col, id] of paths) {
        const snap = await getDoc(doc(db, col, id));
        if (snap.exists()) {
          setInfo({
            uid: user.uid,
            email: user.email,
            foundIn: `${col}/${id}`,
            data: snap.data(),
          });
          return;
        }
      }

      setInfo({
        uid: user.uid,
        email: user.email,
        error: "No profile document found in users/vendors/profiles/accounts",
      });
    })();
  }, []);

  return (
    <pre className="text-xs bg-gray-100 border rounded p-3 overflow-auto max-h-80">
      {JSON.stringify(info, null, 2)}
    </pre>
  );
}
