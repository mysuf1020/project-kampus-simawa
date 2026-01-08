package service

import (
	"strings"
	"unicode"
)

// OrgRoleCodeFromSlug returns org-specific role code (e.g. "abster" -> "ORG_ABSTER", "fc-raharja" -> "ORG_FC_RAHARJA").
func OrgRoleCodeFromSlug(slug string) string {
	s := strings.TrimSpace(strings.ToLower(slug))
	if s == "" {
		return "ORG_UNKNOWN"
	}
	s = strings.ReplaceAll(s, "-", "_")

	var b strings.Builder
	b.Grow(len(s) + 4)
	b.WriteString("ORG_")
	for _, r := range s {
		switch {
		case r == '_':
			b.WriteRune('_')
		case unicode.IsLetter(r) || unicode.IsDigit(r):
			b.WriteRune(unicode.ToUpper(r))
		default:
			// normalize other separators to underscore
			b.WriteRune('_')
		}
	}
	out := b.String()
	out = strings.TrimRight(out, "_")
	out = strings.ReplaceAll(out, "__", "_")
	return out
}
