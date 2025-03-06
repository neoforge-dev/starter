import { expect } from "@esm-bundle/chai";
import { NeoTextInput } from "../../../components/atoms/text-input/text-input.js";

describe("NeoTextInput", () => {
  it("should be defined as a class", () => {
    expect(NeoTextInput).to.be.a("function");
  });

  it("should have expected static properties", () => {
    expect(NeoTextInput.properties).to.exist;
    expect(NeoTextInput.properties.value).to.exist;
    expect(NeoTextInput.properties.placeholder).to.exist;
    expect(NeoTextInput.properties.label).to.exist;
    expect(NeoTextInput.properties.helper).to.exist;
    expect(NeoTextInput.properties.error).to.exist;
    expect(NeoTextInput.properties.type).to.exist;
    expect(NeoTextInput.properties.disabled).to.exist;
    expect(NeoTextInput.properties.required).to.exist;
    expect(NeoTextInput.properties.clearable).to.exist;
  });

  it("should have properties with correct types", () => {
    expect(NeoTextInput.properties.value.type).to.equal(String);
    expect(NeoTextInput.properties.placeholder.type).to.equal(String);
    expect(NeoTextInput.properties.label.type).to.equal(String);
    expect(NeoTextInput.properties.helper.type).to.equal(String);
    expect(NeoTextInput.properties.error.type).to.equal(String);
    expect(NeoTextInput.properties.type.type).to.equal(String);
    expect(NeoTextInput.properties.disabled.type).to.equal(Boolean);
    expect(NeoTextInput.properties.required.type).to.equal(Boolean);
    expect(NeoTextInput.properties.clearable.type).to.equal(Boolean);
  });

  it("should have properties that reflect to attributes", () => {
    expect(NeoTextInput.properties.disabled.reflect).to.be.true;
    expect(NeoTextInput.properties.required.reflect).to.be.true;
    expect(NeoTextInput.properties.type.reflect).to.be.true;
  });

  it("should have expected prototype methods", () => {
    const proto = NeoTextInput.prototype;
    expect(proto.render).to.be.a("function");
    expect(proto._handleInput).to.be.a("function");
    expect(proto._handleChange).to.be.a("function");
    expect(proto._handleFocus).to.be.a("function");
    expect(proto._handleBlur).to.be.a("function");
  });

  it("should extend from LitElement", () => {
    // Check if the component extends LitElement by checking its source code
    const componentString = NeoTextInput.toString();
    expect(componentString.includes("extends LitElement")).to.be.true;
  });
});
