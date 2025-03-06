import { expect, describe, it } from "vitest";
import { NeoRadio } from "../../../components/atoms/radio/radio.js";

describe("NeoRadio", () => {
  it("is defined as a class", () => {
    expect(NeoRadio).to.be.a("function");
    expect(NeoRadio.toString().includes("class")).to.be.true;
  });

  it("has the expected static properties", () => {
    expect(NeoRadio.properties).to.be.an("object");

    // Check that the component has the expected properties
    expect(NeoRadio.properties).to.have.property("label");
    expect(NeoRadio.properties).to.have.property("name");
    expect(NeoRadio.properties).to.have.property("value");
    expect(NeoRadio.properties).to.have.property("checked");
    expect(NeoRadio.properties).to.have.property("disabled");
    expect(NeoRadio.properties).to.have.property("required");
    expect(NeoRadio.properties).to.have.property("error");
  });

  it("has the expected property types", () => {
    expect(NeoRadio.properties.label.type).to.equal(String);
    expect(NeoRadio.properties.name.type).to.equal(String);
    expect(NeoRadio.properties.value.type).to.equal(String);
    expect(NeoRadio.properties.checked.type).to.equal(Boolean);
    expect(NeoRadio.properties.disabled.type).to.equal(Boolean);
    expect(NeoRadio.properties.required.type).to.equal(Boolean);
  });

  it("has properties that reflect to attributes", () => {
    expect(NeoRadio.properties.checked.reflect).to.be.true;
    expect(NeoRadio.properties.disabled.reflect).to.be.true;
    expect(NeoRadio.properties.required.reflect).to.be.true;
  });

  it("has the expected prototype methods", () => {
    expect(NeoRadio.prototype).to.have.property("render");
    expect(NeoRadio.prototype.render).to.be.a("function");

    expect(NeoRadio.prototype).to.have.property("_handleChange");
    expect(NeoRadio.prototype._handleChange).to.be.a("function");
  });

  it("extends from LitElement", () => {
    // Check that the component extends LitElement
    const prototypeChain = [];
    let proto = Object.getPrototypeOf(NeoRadio.prototype);

    while (proto && proto.constructor.name) {
      prototypeChain.push(proto.constructor.name);
      proto = Object.getPrototypeOf(proto);
    }

    expect(prototypeChain).to.include("LitElement");
  });
});
