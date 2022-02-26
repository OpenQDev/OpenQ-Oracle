const axios = require('axios');
const claim = require('../claim');
const MockAdapter = require("axios-mock-adapter");

describe('claim.js', () => {
	beforeAll(() => {
		mock = new MockAdapter(axios);
	});

	beforeEach(() => {
		mock.reset();
	});

	it('should resolve with txnHash and issueId when given it with status code 200', async () => {
		const expectedData = { txnHash: "0xsf", issueId: "sdfs" };
		mock.onPost('http://openq-oz-claim-autotask:8070').reply(200, expectedData);
		const result = await claim('issueUrl', 'payouAddress', 'oauthToken');
		const { data } = result;
		await expect(data).toEqual(expectedData);
	});
});