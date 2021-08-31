index.js with an exports.handler and node_modules

create lambda

configure private key in env vars

zip and push code
zip -r function.zip .
aws lambda update-function-code --function-name WithdrawEthForIssue --zip-file fileb://function.zip

increase timeout

test