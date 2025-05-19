"use client";

import { ClipLoader } from "react-spinners";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <ClipLoader color="#001F4D" size={50} />
    </div>
  );
}
