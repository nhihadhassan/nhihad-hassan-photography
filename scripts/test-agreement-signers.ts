import assert from "node:assert/strict";
import { remainingAgreementSigners, requiredAgreementSigners } from "../src/lib/agreement-signers";

const request = {
  client_name: "Kawish Lakhani",
  client_email: "kawish.lakhani@gmail.com",
  details: {
    secondSignerName: "Farkhunda Alef",
    secondSignerEmail: "far.alef0927@gmail.com",
  },
};

const required = requiredAgreementSigners(request);
assert.deepEqual(required, [
  { name: "Kawish Lakhani", email: "kawish.lakhani@gmail.com" },
  { name: "Farkhunda Alef", email: "far.alef0927@gmail.com" },
]);
assert.deepEqual(remainingAgreementSigners(required, []), required);
assert.deepEqual(remainingAgreementSigners(required, ["KAWISH.LAKHANI@GMAIL.COM"]), [required[1]]);
assert.deepEqual(remainingAgreementSigners(required, required.map((signer) => signer.email)), []);

assert.deepEqual(requiredAgreementSigners({
  client_name: "Legacy Client",
  client_email: null,
  details: {},
}), [{ name: "Legacy Client", email: "" }]);

console.log("Agreement signer tests passed (single and dual signer flows). ");
