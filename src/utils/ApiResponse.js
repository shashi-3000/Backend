class ApiResponse{
    constructor(statusCode,data,message="success"){
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=statusCode<400
    }
}
export {ApiResponse}