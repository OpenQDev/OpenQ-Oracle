async function checkCanWithdraw() {
    const checkWithdrawalEligibility = require('../lib/check-withdrawal-eligibility');
    const canWithdraw = await checkWithdrawalEligibility(github.graphql, context.payload.sender.login, issue.data.node_id);
}