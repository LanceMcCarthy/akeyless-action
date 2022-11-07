

# AKeyless GitHub Action

This action will login to AKeyless using JWT or IAM authentication and then fetch secrets and/or provision AWS access via a dynamic producer.

- [AKeyless GitHub Action](#akeyless-github-action)
    - [Inputs](#inputs)
    - [Outputs](#outputs)
    - [Job Permissions Requirement](#job-permissions-requirement)
  - [AKeyless Setup](#akeyless-setup)
    - [Authentication Methods](#authentication-methods)
    - [Setting up JWT Auth](#setting-up-jwt-auth)
  - [Examples](#examples)
    - [Static Secrets Demo](#static-secrets-demo)
    - [Dynamic Secrets Example](#dynamic-secrets-example)
  - [Feature Requests & Issues](#feature-requests--issues)

### Inputs

| Name | Required | Type | Value |
|------|----------|------|-------|
| access-id | Yes | string  | The access id for your auth method |
| access-type  | No | `string`  | The login method to use.  Must be `jwt` or `aws_iam`.  Defaults to `jwt` |
| api-url | No | `string`  | The API endpoint to use.  Defaults to `https://api.akeyless.io` |
| producer-for-aws-access | No | `string`  | Path to an AWS dynamic producer.  If provided, AWS credentials will be fetched from it and exported to the environment |
| static-secrets | No | `string` | A JSON object as a string, with a list of static secrets to fetch/export.  The key should be the path to the secret and the value should be the name of the environment variable/output to save it to. |
| dynamic-secrets | No | `string` | A JSON object as a string, with a list of dynamic secrets to fetch/export.  The key should be the path to the secret and the value should be the name of the environment variable/output to save it to. |
| export-secrets-to-outputs | No | `boolean` | True/False to denote if static/dynamic secrets should be exported as environment variables.  Defaults to `true` |
| export-secrets-to-environment | No | `boolean` | True/False to denote if static/dynamic secrets should be exported as action outputs.  Defaults to `true` |

### Outputs

The job outputs are determined by the values set in your `static-secrets` and `dynamic-secrets` inputs, as well as whether or not the `export-secrets-to-outputs` is set to true (which it is by default).

| Name | Value |
|------|-------|
| outputs | use `${{ steps.JOB_NAME.outputs.SECRET_NAME }}` |
| environment variables | use `${{ env.SECRET_NAME }}` |

### Job Permissions Requirement

The default usage relies on using the GitHub JWT to login to AKeyless.  To make this available, you have to configure it in your job workflow:

```
jobs:
  my_job:
    #---------Required---------#
    permissions: 
      id-token: write
      contents: read
    #--------------------------#
```
> If this is not present, the akeyless-action step will fail with the following error `Failed to login to AKeyless: Error: Failed to fetch Github JWT: Error message: Unable to get ACTIONS\_ID\_TOKEN\_REQUEST\_URL env variable`

## AKeyless Setup

### Authentication Methods

This action only supports authenticating to AKeyless via JWT auth (using the GitHub OIDC token) or via IAM Auth (using a role attached to a cloud-hosted GitHub runner).  I don't plan to support additional authentication methods because there isn't much point (with the possible exception of Universal Identity).  After all, any runner can login to AKeyless using OIDC without storing permanent access credentials.  IAM auth is also supported in case you are using a runner hosted in your cloud account and so are already using IAM auth anyway - this will also give your runner access to AKeyless without storing permanent access credentials.

### Setting up JWT Auth

To configure AKeyless and grant your repositories the necessary permissions to execute this action:

1. Create a GitHub JWT Auth method in AKeyless if you don't have one (you can safely share the auth method between repositories)
    1. In AKeyless go to "Auth Methods" -> "+ New" -> "OAuth 2.0/JWT".
    2. Specify a name (e.g. "GitHub JWT Auth") and location of your choice.
    3. For the JWKS Url, specify `https://token.actions.githubusercontent.com/.well-known/jwks`
    4. For the unique identifier use `repository`. See note (1) below for more details.
    5. You **MUST** click "Require Sub Claim on role association".  This will prevent you from attaching this to a role without any additional checks. If you accidentally forgot to set subclaim checks, then any GitHub runner owned by *anyone* would be able to authenticate to AKeyless and access your resources... **that make this a critical checkbox**.  See the [GitHub docs](https://docs.GitHub.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud) for more details.
2. Create an appropriate access role (if you don't already have one)
    1. In AKeyless go to "Access Roles" -> "+ New"
    2. Give it a name and location, and create it.
    3. Find your new access role and click on it to edit it.
    4. On the right side, under "Secrets & Keys", click the "Add" button to configure read access to any static or dynamic secrets you will fetch from your pipeline.
3. Attach your GitHub JWT Auth method to your role
    1. Once again, find the access role you created in step #2 above and click on it to edit it.
    2. Hit the "+ Associate" button to associate your "GitHub JWT Auth" method with the role.
    3. In the list, find the auth method you created in Step #1 above.
    4. Add an appropriate sub claim, based on [the claims available in the JWT](https://docs.GitHub.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#understanding-the-oidc-token). See note (2) below for more details.
    5. Save!

After following these steps, you'll be ready to use JWT Auth from your GitHub runners!

**(1) Note:** The unique identifier is mainly used for auditing/billing purposes, so there isn't one correct answer here.  `repository` is a sensible default but if you are uncertain, talk to AKeyless for more details.

**(2) Note:** Subclaim checks allow AKeyless to grant access to specific workflows, based on the claims that GitHub provides in the JWT.  Using the example JWT from [the documentation](https://docs.GitHub.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#understanding-the-oidc-token), you could set a subclaim check in AKeyless (using example below) to limit access to workflows that were triggered from the main branch in the `octo-org/octo-repo` repository.:

```
repository=octo-org/octo-repo
ref=refs/heads/main
```

## Examples

Here are some examples you can use for guidance:

- A real-world scenario using NuGet Secrets in [LanceMcCarthy/DevOpsExamples => main_build-console.yml](https://github.com/LanceMcCarthy/DevOpsExamples/blob/main/.github/workflows/main_build-console.yml).
- This Action's CI validation workflow at [LanceMcCarthy/akeyless-action => workflows/ci.yml](https://github.com/LanceMcCarthy/akeyless-action/blob/main/.github/workflows/ci.yml).
- Use the YAML snippet below for a quick start:

### Static Secrets Demo
```
jobs:
  fetch_secrets:
    runs-on: ubuntu-latest
    permissions:  # IMPORTANT - both of these are required
      id-token: write
      contents: read
    name: Fetch some static secrets
    steps:
    - name: Fetch secrets from AKeyless
      id: fetch-secrets
      uses: LanceMcCarthy/akeyless-action@v2
      with:
        access-id: auth-method-access-id     # (ex: 'p-iwt13fd19ajd') We recommend storing this as a GitHub Actions secret
        static-secrets: '{"/path/to/static/secret":"my_first_secret","/path/to/another/secret":"my_second_secret"}'
        dynamic-secrets: '{"/path/to/dynamic/secret":"my_dynamic_secret"}'
        export-secrets-to-outputs: true      # default = true
        export-secrets-to-environment: true  # default = true
        
    - name: Use Outputs
      run: |
        echo "Step Outputs"
        echo "my_first_secret: ${{ steps.fetch-secrets.outputs.my_first_secret }}"
        echo "my_second_secret: ${{ steps.fetch-secrets.outputs.my_second_secret }}"
        echo "my_dynamic_secret: ${{ steps.fetch-secrets.outputs.my_dynamic_secret }}"
        
        echo "Environment Variables"
        echo "my_first_secret: ${{ env.my_first_secret }}"
        echo "my_second_secret: ${{ env.my_second_secret }}"
        echo "my_dynamic_secret: ${{ env.my_dynamic_secret }}"
```

### Dynamic Secrets Example

The key difference with dynamic secrets is the output value is typcially a json array. If you want those secrets as separate environment variables, there's one extra step to take. See the `KEY TAKEAWAY` section in the following example.

```yaml
  fetch_aws_dynamic_secrets:
    runs-on: ubuntu-latest
    name: Fetch AWS dynamic secrets
    permissions:
      id-token: write
      contents: read
    steps:
    - name: Checkout
      uses: actions/checkout@v2
      with:
        fetch-depth: 0

    - name: Fetch dynamic secrets from AKeyless
      id: fetch-dynamic-secrets
      uses: ./
      with:
        access-id: ${{ secrets.AKEYLESS_ACCESS_ID }} # Looks like p-fq3afjjxv839
        dynamic-secrets: '{"/DevTools/test-grib":"aws_dynamic_secrets"}'
        
    # **** KEY TAKEAWAY - EXPORT EVERY DYNAMIC SECRET VALUE AS ENV VARS *****
    - name: Export Secrets to Environment
      run: |
        echo '${{ steps.fetch-dynamic-secrets.outputs.aws_dynamic_secrets }}' | jq -r 'to_entries|map("AWS_\(.key)=\(.value|tostring)")|.[]' >> $GITHUB_ENV

    # You can now access each secret separately as environment variables
    - name: Verify Vars
      run: |
        echo "access_key_id: ${{ env.AWS_access_key_id }}"
        echo "id: ${{ env.AWS_id }}"
        echo "secret_access_key: ${{ env.AWS_secret_access_key }}"
        echo "security_token: ${{ env.AWS_security_token }}"
        echo "ttl_in_minutes: ${{ env.AWS_ttl_in_minutes }}"
        echo "type: ${{ env.AWS_type }}"
        echo "user: ${{ env.AWS_user }}"
```

Here's a screenshot from an example workflow.  Notice how you can now access every separate dynamic secret vis it's expected keyname:

![dyn-secrets-out-highlighted](https://user-images.githubusercontent.com/3520532/200424232-d52d0896-cabb-4ff1-bef3-76652c5ac469.png)

## Feature Requests & Issues

This repo is a fork of [cmancone/akeyless-action](https://github.com/cmancone/akeyless-action). This repo is intended to be the primary source of future development and maintenence for the action published to the GitHub Marketplace. Please open Feature Requests and report Issues here instead of the upstream repo. Thank you!
