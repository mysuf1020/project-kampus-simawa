package sanitize

import (
	"github.com/microcosm-cc/bluemonday"
)

var policy *bluemonday.Policy

func init() {
	policy = bluemonday.UGCPolicy()
}

func String(s string) string {
	return policy.Sanitize(s)
}
