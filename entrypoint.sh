#!/bin/sh -l

# Export AWS configuration variables which will be picked up by AWS-CLI
export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION
export OVERLAY_S3URL="s3://${BUCKET_NAME}/${LAMBDA_FUNC_NAME}/lambda-deploy.tgz"

# Zip up and upload your project in the src/ folder to the AWS S3 cloud
tar -czvf lambda-deploy-overlay.tgz ./
aws s3 cp --acl public-read lambda-deploy-overlay.tgz "$OVERLAY_S3URL"

# zip src/ folder
rm -f lambda-deploy.zip
cd src; zip -r ../lambda-deploy.zip *
cd ..

# Validate your template structure.
aws cloudformation validate-template \
    --template-body file://template.yaml

# package template.yaml and have it generate packaged.yaml file with S3 reference link to the uploaded code
aws cloudformation package \
   --template-file template.yaml \
   --output-template-file packaged.yaml \
   --s3-bucket "${BUCKET_NAME}" 

# Deploy the cloudformation stack with the parameters required
if  aws cloudformation deploy \
        --stack-name ${LAMBDA_FUNC_NAME} \
        --template-file packaged.yaml \
        --capabilities CAPABILITY_IAM \
        --region ${AWS_DEFAULT_REGION} \
        --parameter-overrides LambdaFuncName=${LAMBDA_FUNC_NAME} \
            LambdaRuntime=${LAMBDA_RUNTIME} \
            LambdaHandler=${LAMBDA_HANDLER} \
            LambdaMemory=${LAMBDA_MEMORY} \
            LambdaTimeout=${LAMBDA_TIMEOUT} 
    then 
        exit 0
    else
        exit 1
fi

    
exit 0 
