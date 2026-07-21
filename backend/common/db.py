"""DynamoDB 리소스/클라이언트 공용 접근점. 콜드스타트마다 재생성하지 않도록 모듈 레벨에 캐싱."""
import os
import boto3

_resource = None
_client = None


def resource():
    global _resource
    if _resource is None:
        _resource = boto3.resource("dynamodb")
    return _resource


def client():
    global _client
    if _client is None:
        _client = boto3.client("dynamodb")
    return _client


def table(env_var_name: str):
    return resource().Table(os.environ[env_var_name])
