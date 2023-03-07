package client

func CursorParam(cursor string) QueryParam {
	return QueryParam{
		Param: "cursor",
		Value: cursor,
	}
}

func PageSizeParam(size uint) QueryParam {
	return QueryParam{
		Param: "page-size",
		Value: size,
	}
}

func OrderParam(order string) QueryParam {
	return QueryParam{
		Param: "order",
		Value: order,
	}
}
