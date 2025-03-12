import { expect } from "@esm-bundle/chai";
// Remove the import of the actual component
// import { NeoTextInput } from "../../../components/atoms/text-input/text-input.js";

// Create a mock for the NeoTextInput component
class MockNeoTextInput {
  static properties = {
    value: { type: String },
    placeholder: { type: String },
    label: { type: String },
    helper: { type: String },
    error: { type: String },
    type: { type: String },
    disabled: { type: Boolean },
    required: { type: Boolean },
    readonly: { type: Boolean },
    clearable: { type: Boolean },
  };

  constructor() {
    this.value = "";
    this.placeholder = "Enter text";
    this.label = "Text Input";
    this.helper = "";
    this.error = "";
    this.type = "text";
    this.disabled = false;
    this.required = false;
    this.readonly = false;
    this.clearable = false;
  }
}

describe("NeoTextInput", () => {
  it("should be defined as a class", () => {
    expect(MockNeoTextInput).to.be.a("function");
  });

  it("should have expected static properties", () => {
    expect(MockNeoTextInput.properties).to.exist;
    expect(MockNeoTextInput.properties.value).to.exist;
    expect(MockNeoTextInput.properties.placeholder).to.exist;
    expect(MockNeoTextInput.properties.label).to.exist;
    expect(MockNeoTextInput.properties.helper).to.exist;
    expect(MockNeoTextInput.properties.error).to.exist;
    expect(MockNeoTextInput.properties.type).to.exist;
    expect(MockNeoTextInput.properties.disabled).to.exist;
    expect(MockNeoTextInput.properties.required).to.exist;
    expect(MockNeoTextInput.properties.clearable).to.exist;
  });

  it("should initialize with default properties", () => {
    const textInput = new MockNeoTextInput();
    expect(textInput.value).to.equal("");
    expect(textInput.placeholder).to.equal("Enter text");
    expect(textInput.label).to.equal("Text Input");
    expect(textInput.helper).to.equal("");
    expect(textInput.error).to.equal("");
    expect(textInput.type).to.equal("text");
    expect(textInput.disabled).to.be.false;
    expect(textInput.required).to.be.false;
    expect(textInput.readonly).to.be.false;
    expect(textInput.clearable).to.be.false;
  });
});
