var express = require('express');
var router = express.Router();
var esm = require('../services/electrumSocketEmitter');
var utils = require('../services/utils');

router.post('/', async function (req, res, next) {
    let address = req.body.address ? req.body.address : "";
    if (!address) {
        res.send(false);
        return;
    }
    res.setHeader('Content-Type', 'application/json');
    let results = [];

    if (Array.isArray(address)) {
        address = utils.uniq(address);
        let resultsRequests = [];

        await utils.asyncForEach(address, async function (addr) {
            let pending = await esm.electrumRequest('blockchain.address.get_history', [addr]);
            resultsRequests.push(pending);
        });

        resultsRequests.forEach(function (request) {
            let requestObj = JSON.parse(request);
            if (requestObj.result) results = results.concat(requestObj.result);
        });

    } else {
        let txidList = await esm.electrumRequest('blockchain.address.get_history', [address]);
        let txidSet = JSON.parse(txidList);
        if (txidSet.result) results = txidSet.result;
    }

    if (results) {
        res.send(results);
    } else {
        res.status(400);
        res.send(false);
    }
});

module.exports = router;
