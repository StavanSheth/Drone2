class DroneDomainException(Exception):
    """Base domain exception."""
    pass

class SerialPortException(DroneDomainException):
    pass

class ModelInferenceException(DroneDomainException):
    pass

class RAGPipelineException(DroneDomainException):
    pass
