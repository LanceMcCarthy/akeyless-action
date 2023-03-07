# AKeyless GitHub Action

This action will login to AKeyless using JWT or IAM authentication and then fetch secrets and/or provision AWS access via a dynamic producer.

| Workflow | Status |
|----------|--------|
| `main` | [![CI Main](https://github.com/LanceMcCarthy/akeyless-action/actions/workflows/ci.yml/badge.svg)](https://github.com/LanceMcCarthy/akeyless-action/actions/workflows/ci.yml) |

### Inputs

| Name | Required | Type | Value |
|------|----------|------|-------|
| **access-id** | Yes | `string`  | The access id for your auth method. |
| **access-type**  | No | `string`  | Default: `jwt`. The login method to use, must be `jwt` or `aws_iam`.  |
| **api-url** | No | `string`  | Default: `https://api.akeyless.io`. The API endpoint to use. |
| **producer-for-aws-access** | No | `string`  | Path to an AWS dynamic producer. If provided, AWS credentials will be fetched from it and exported to the environment |
| **static-secrets** | No | `string` | A JSON object as a string, with a list of static secrets to fetch/export.  The key should be the path to the secret and the value should be the name of the environment variable/output to save it to. |
| **dynamic-secrets** | No | `string` | A JSON object as a string, with a list of dynamic secrets to fetch/export.  The key should be the path to the secret and the value should be the name of the environment variable/output to save it to. |
| **export-secrets-to-outputs** | No | `boolean` | Default: `true`. True/False to denote if static/dynamic secrets should be exported as environment variables.  |
| **export-secrets-to-environment** | No | `boolean` | Default: `true`. True/False to denote if static/dynamic secrets should be exported as action outputs. |
| **parse-dynamic-secrets** | No | `boolean` | Default: `false`. True/False to denote if dynamic secrets will be broken up into individual outputs/env vars, see the [parsed dynamic secrets demos](#parsed-dynamic-secrets). |

> It is important that you follow the instructions in the [AKeyless Setup](#akeyless-setup) and [Job Permissions Requirement](#job-permissions-requirement) sections **before** using this Action.

### Outputs

The job outputs are determined by the values set in your `static-secrets` and `dynamic-secrets` inputs, as well as whether or not the `export-secrets-to-outputs` is set to true (which it is by default).

##### Default Outputs

The default behavior will create a single output/env variable that uses the name you set for the output.

| Name | Value |
|------|-------|
| outputs | use `${{ steps.JOB_NAME.outputs.SECRET_NAME }}` |
| environment variables | use `${{ env.SECRET_NAME }}` |

##### Parsed Outputs

If you enabled `parse-dynamic-secrets: true`, you'll get each of the values in their own output/env variable automatically. For example, if your dynamic secret is `{ "id": "", "username": "", "password": "" }`
the outputs will be:

| Name | Value |
|------|-------|
| job outputs | `${{ steps.job-name.outputs.id }}` |
|  | `${{ steps.job-name.outputs.username }}` |
|  | `${{ steps.job-name.outputs.password }}` |
| environment variables | `${{ env.id }}` |
|  | `${{ env.username }}` |
|  | `${{ env.password }}` |

See the [parsed dynamic secrets](#parsed-dynamic-secrets) example for a better explanation.

## Table of Contents

- [AKeyless GitHub Action](#akeyless-github-action)
    - [Inputs](#inputs)
    - [Outputs](#outputs)
  - [Job Permissions Requirement](#job-permissions-requirement)
  - [Examples](#examples)
    - [Live Demos](#live-demos)
    - [Static Secrets Demo](#static-secrets-demo)
    - [Dynamic Secrets](#dynamic-secrets-demos)
  - [AKeyless Setup](#akeyless-setup)
    - [Authentication Methods](#authentication-methods)
    - [Setting up JWT Auth](#setting-up-jwt-auth)
  - [Feature Requests & Issues](#feature-requests--issues)
  - [Breaking changes](#breaking-changes)
  

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

## Examples

### Live Demos

Although this repository's workflows use placeholder values, it is still a real AKeyless account and real providers. The approaches demonstrated are still valid as-is for real implementations. Use these to your advantage!

- **Static Secrets**
  - [Static secret (standard)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L8-L31)
- **Dynamic Secrets (AWS provider)** 
  - [AWS dynamic secrets (default)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L33-L88)
  - [AWS dynamic secrets (auto-parsed)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L90-L128)
  - [AWS dynamic secrets (auto-parsed w/prefix)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L130-L168)
- **Dynamic Secrets (Database provider)**
  - [SQL dynamic secrets (default)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L170-L222)
  - [SQL dynamic secrets (auto-parsed)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L224-L262)
  - [SQL dynamic secrets (auto-parsed w/prefix)](https://github.com/LanceMcCarthy/akeyless-action/blob/eef49f96c7ead7c3a4ae596a5e7fa32099778bd6/.github/workflows/ci.yml#L264-L296)

### Static Secrets Demo

Static secrets are the easiest to use. Just define the secret's path and the secret's output.

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
      uses: LanceMcCarthy/akeyless-action@v3
      with:
        access-id: auth-method-access-id     # (ex: 'p-iwt13fd19ajd') We recommend storing this as a GitHub Actions secret
        static-secrets: '{"/path/to/static/secret":"my_first_secret","/path/to/another/secret":"my_second_secret"}'
        
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

### Dynamic Secrets Demos

The key difference with dynamic secrets is the output value is typically a JSON object. there are two ways you can handle this; *default* output or *parsed* outputs

#### Default Output

If you want those secrets as separate environment variables, there's one extra step to take. See the `KEY TAKEAWAY` section in the following example.

```yaml
  fetch_aws_dynamic_secrets:
    runs-on: ubuntu-latest
    name: Fetch AWS dynamic secrets
    
    permissions:
      id-token: write
      contents: read
      
    steps:
    - name: Fetch dynamic secrets from AKeyless
      id: fetch-dynamic-secrets
      uses: LanceMcCarthy/akeyless-action@v3
      with:
        access-id: ${{ secrets.AKEYLESS_ACCESS_ID }} # Looks like p-fq3afjjxv839
        dynamic-secrets: '{"/path/to/dynamic/aws/secret":"aws_dynamic_secrets"}'
        
# **** KEY TAKEAWAY - EXPORT DYNAMIC SECRET's KEYS TO ENV VARS *****
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

#### Parsed Output

If you set `parse-dynamic-secrets: true`, the job will automatically create a a separate output for every key in the dynamic secret. This is extremely useful if you do not want to manually parse it, or if you need to immediately use an output's value in a subsequent step.

For example, a SQL server dynamic secret will provide **id**, **user**, **ttl_in_minutes** and **password** values.

```yaml
- name: Fetch dynamic secrets from AKeyless (NO PREFIX)
  id: get-secrets
  uses: LanceMcCarthy/akeyless-action@v3
  with:
    access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
    dynamic-secrets: '{"/DevTools/my-sqlsrv-secret":""}' # no prefix, use an empty string for output var
    parse-dynamic-secrets: true
```

Then the outputs/vars will be directly generated for each key: `id`, `user`, `ttl_in_minutes`, and `password` values.

Step Outputs:
```bash
echo ${{ steps.get-secrets.outputs.id }}
echo ${{ steps.get-secrets.outputs.user }}
echo ${{ steps.get-secrets.outputs.ttl_in_minutes }}
echo ${{ steps.get-secrets.outputs.password }}
```

Environment Variables:

```bash
echo ${{ env.id }}
echo ${{ env.user }}
echo ${{ env.ttl_in_minutes }}
echo ${{ env.password }}
```

##### Using a Prefix

Sometimes you might want to prefix the variable name. This is easily done by setting an output name, that value will be used to prefix all the output keys.

For example, using "SQL" for the output path:

```yaml
- name: Fetch dynamic secrets from AKeyless ('SQL' prefix)
  uses: LanceMcCarthy/akeyless-action@v3
  id: job-name
  with:
    access-id: ${{ secrets.AKEYLESS_ACCESS_ID }}
    dynamic-secrets: '{"/DevTools/my-sqlsrv-secret":"SQL"}' # uses 'SQL' for prefix
    parse-dynamic-secrets: true
```
The action will prefix `SQL_` prefix to all the automatically parsed outputs:

```bash
# notice the extra "SQL_" prefix
echo ${{ env.SQL_user }}
echo ${{ steps.job-name.outputs.SQL_user }}
```

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

## Feature Requests & Issues

Although forked from [cmancone/akeyless-action](https://github.com/cmancone/akeyless-action), this repo is primary source of feature development and maintenance for the `akeyless-action` published to the GitHub Marketplace.

If you have any problems or would like to see a new feature, please [open Feature Requests and report Issues here](https://github.com/LanceMcCarthy/akeyless-action/issues) instead of the upstream repo. Thank you!

## Breaking Changes

If you're coming form an older version of this action before it was published in the GitHub Marketplace (1.0 and earlier), you may notice a difference in behavior. I will attempt to briefly mention what you need to be aware of in this table.

| Version Range | Comment |
|---------------|---------|
| 1.0-1.1 | Original implementation from cmancone/akeyless-action |
| 1.1-2.x | Introduction of masking sensitive values in output. |
| 3.0     | Introduction of parsed outputs, no breaking changes if the defaults are not changed. |
