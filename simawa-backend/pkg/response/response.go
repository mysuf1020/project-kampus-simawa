package response

type Response struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

func OK(data any) Response {
	return Response{Success: true, Message: "success", Data: data}
}

func Err(msg string) Response {
	return Response{Success: false, Message: msg}
}
