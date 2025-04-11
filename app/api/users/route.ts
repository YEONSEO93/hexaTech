import { AdminCreateUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient, USER_POOL_ID } from "@/lib/aws-config";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, email, temporaryPassword } = await request.json();

    const command = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "email_verified",
          Value: "true",
        },
      ],
      TemporaryPassword: temporaryPassword,
      MessageAction: "SUPPRESS", // 자동 이메일 발송 억제
    });

    const response = await cognitoClient.send(command);

    return NextResponse.json({
      success: true,
      user: response.User,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
