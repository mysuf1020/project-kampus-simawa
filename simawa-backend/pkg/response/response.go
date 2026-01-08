package response

type Response[T any] struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    *T     `json:"data,omitempty"`
}

func OK[T any](data *T) Response[T] {
	return Response[T]{Success: true, Message: "success", Data: data}
}
func Err(msg string) Response[any] { return Response[any]{Success: false, Message: msg} }
