package validator

import (
	"unicode"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

func Init() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		_ = v.RegisterValidation("passwd", func(fl validator.FieldLevel) bool {
			pass, _ := fl.Field().Interface().(string)
			if len(pass) < 8 {
				return false
			}
			var hasUpper, hasLower, hasDigit bool
			for _, c := range pass {
				switch {
				case unicode.IsUpper(c):
					hasUpper = true
				case unicode.IsLower(c):
					hasLower = true
				case unicode.IsDigit(c):
					hasDigit = true
				}
			}
			return hasUpper && hasLower && hasDigit
		})
	}
}
