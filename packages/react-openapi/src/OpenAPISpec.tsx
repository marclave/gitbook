'use client';

import { OpenAPIV3 } from 'openapi-types';
import { InteractiveSection } from './InteractiveSection';
import { OpenAPIRequestBody } from './OpenAPIRequestBody';
import { OpenAPIResponses } from './OpenAPIResponses';
import { OpenAPISchemaProperties } from './OpenAPISchema';
import { OpenAPIOperationData, fromJSON } from './fetchOpenAPIOperation';
import { OpenAPIClientContext } from './types';
import { noReference } from './utils';
import { OpenAPISecurities } from './OpenAPISecurities';

/**
 * Client component to render the spec for the request and response.
 *
 * We use a client component as rendering recursive JSON schema in the server is expensive
 * (the entire schema is rendered at once, while the client component only renders the visible part)
 */
export function OpenAPISpec(props: { rawData: any; context: OpenAPIClientContext }) {
    const { rawData, context } = props;
    const { operation, securities } = fromJSON(rawData) as OpenAPIOperationData;

    const parameterGroups = groupParameters((operation.parameters || []).map(noReference));

    return (
        <>
            {securities.length > 0 ? (
                <OpenAPISecurities securities={securities} context={context} />
            ) : null}

            {parameterGroups.map((group) => (
                <InteractiveSection
                    key={group.key}
                    className="openapi-parameters"
                    toggeable
                    toggleOpenIcon={context.icons.chevronRight}
                    toggleCloseIcon={context.icons.chevronDown}
                    header={group.label}
                    defaultOpened={group.key === 'path'}
                >
                    <OpenAPISchemaProperties
                        properties={group.parameters.map((parameter) => ({
                            propertyName: parameter.name,
                            schema: noReference(parameter.schema) ?? {},
                            required: parameter.required,
                        }))}
                        context={context}
                    />
                </InteractiveSection>
            ))}

            {operation.requestBody ? (
                <OpenAPIRequestBody
                    requestBody={noReference(operation.requestBody)}
                    context={context}
                />
            ) : null}

            {operation.responses ? (
                <OpenAPIResponses responses={noReference(operation.responses)} context={context} />
            ) : null}
        </>
    );
}

function groupParameters(parameters: OpenAPIV3.ParameterObject[]): Array<{
    key: string;
    label: string;
    parameters: OpenAPIV3.ParameterObject[];
}> {
    const sorted = ['path', 'query', 'header'];

    const groups: Array<{
        key: string;
        label: string;
        parameters: OpenAPIV3.ParameterObject[];
    }> = [];

    parameters.forEach((parameter) => {
        const key = parameter.in;
        const label = getParameterGroupName(parameter.in);
        const group = groups.find((group) => group.key === key);
        if (group) {
            group.parameters.push(parameter);
        } else {
            groups.push({
                key,
                label,
                parameters: [parameter],
            });
        }
    });

    groups.sort((a, b) => sorted.indexOf(a.key) - sorted.indexOf(b.key));

    return groups;
}

function getParameterGroupName(paramIn: string): string {
    switch (paramIn) {
        case 'path':
            return 'Path parameters';
        case 'query':
            return 'Query parameters';
        case 'header':
            return 'Header parameters';
        default:
            return paramIn;
    }
}