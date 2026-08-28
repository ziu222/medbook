import boto3

client = boto3.client("cognito-idp")


def handler(event, context):
    # Self-service signup only — accounts created by an admin (doctor, admin) already
    # get their group assigned by hand and never hit this trigger.
    if event.get("triggerSource") == "PostConfirmation_ConfirmSignUp":
        client.admin_add_user_to_group(
            UserPoolId=event["userPoolId"],
            Username=event["userName"],
            GroupName="patient",
        )
    return event
