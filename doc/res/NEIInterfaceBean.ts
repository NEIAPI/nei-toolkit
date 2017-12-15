import {Schema} from "swagger-schema-official";

export class Parameter {
	datatypeName?: string;
	defaultValue?: string;
	genExpression?: string; // 预留
	// ignored 这个字段不需要使用
	isArray: boolean = false;
	isObject?: boolean;
	name: string = "";
	// parentId: number;
	// parentType: number;
	position: number;
	required: boolean = true;
	type?: number;
	description: string="";
	typeName: string;
	valExpression?: string; // 预留
}

export class Datatype{
	description: string;
	format: number;
	name: string;
	params: Array<Parameter>;
	tag: string;
	type: number = 0;
	id?: number;
}

export class NeiInterfaceParams{
	inputs: Array<Parameter> = [];
	outputs: Array<Parameter> = [];
}

export class NEIInterfaceBean {
	className: string;
	description: string;
	method: string;
	tags: string;
	name: string;
	params: NeiInterfaceParams;
	path: string;
	resFormat: number;
	constructor(){
		this.params = new NeiInterfaceParams();
	}
}