import Image from "next/image";
import Link from "next/link";

interface Props {
    children: React.ReactNode;
}

const SingleLogoLayout = ({ children }: Props) => {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-gray-50 p-6 -mt-32">
            <div className="w-full max-w-md space-y-12">
                <div className="flex justify-center">
                    <Link href="/login">
                        <Image
                            src="/logo.png"
                            alt="Image"
                            width={200}
                            height={60}
                            className="mb-12"
                        />
                    </Link>
                </div>
                {children}
            </div>
        </div>
    );
}

export default SingleLogoLayout;