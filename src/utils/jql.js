export const filterIssuesJQL = (issues, query) => {
    if (!query || !query.trim()) return issues;

    let searchString = query;
    const jqlFilters = [];

    // Regex to match field operator value
    // e.g. status="in progress" or priority:high or assignee != "john doe"
    // Also matches standard Jira operators like = and !=
    const jqlRegex = /(\w+)\s*(=|!=|:)\s*("[^"]+"|\S+)/g;

    let match;
    while ((match = jqlRegex.exec(query)) !== null) {
        jqlFilters.push({
            field: match[1].toLowerCase(),
            operator: match[2],
            value: match[3].replace(/^"|"$/g, '').toLowerCase() // remove quotes
        });
        searchString = searchString.replace(match[0], '');
    }

    // Clean up free text search string (removing 'AND'/'OR' joining words casually used)
    const freeText = searchString
        .replace(/\b(and|or)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    return issues.filter(issue => {
        // 1. Check JQL specific filters
        for (const filter of jqlFilters) {
            let issueValue = '';

            switch (filter.field) {
                case 'status':
                    issueValue = issue.status;
                    break;
                case 'priority':
                    issueValue = issue.priority;
                    break;
                case 'type':
                    issueValue = issue.type;
                    break;
                case 'assignee':
                    issueValue = issue.assignee?.name || 'unassigned';
                    break;
                case 'reporter':
                    issueValue = issue.reporter?.name || 'unassigned';
                    break;
                case 'sprint':
                    issueValue = issue.sprint?.name || (issue.sprint ? 'assigned' : 'backlog');
                    break;
                default:
                    // If it's an unrecognized field, we might ignore or fail it.
                    // For now, let's treat it as a string check if possible.
                    issueValue = issue[filter.field] || '';
            }

            issueValue = String(issueValue).toLowerCase();

            if (filter.operator === '=' || filter.operator === ':') {
                if (issueValue !== filter.value && !issueValue.includes(filter.value)) return false;
            } else if (filter.operator === '!=') {
                if (issueValue === filter.value || issueValue.includes(filter.value)) return false;
            }
        }

        // 2. Check free text search on remaining unparsed tokens
        if (freeText) {
            const inTitle = issue.title.toLowerCase().includes(freeText);
            const inKey = issue.key.toLowerCase().includes(freeText);
            const inDesc = issue.description?.toLowerCase().includes(freeText) || false;

            if (!inTitle && !inKey && !inDesc) {
                return false;
            }
        }

        return true;
    });
};
