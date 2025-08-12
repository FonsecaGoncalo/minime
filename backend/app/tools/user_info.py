import logging
from typing import Annotated

from haystack.tools import tool

from memory.conversation_store import UserInfo

logger = logging.getLogger(__name__)


def make_update_user_info_tool(mem):
    @tool(name="update_user_info",
          description="Store user info in memory")
    def update_user_info(
            name: Annotated[str, "User name"],
            company: Annotated[str, "Company name"],
            role: Annotated[str, "Role name"],
    ) -> str:
        try:
            mem.store.save_user_info(UserInfo(name=name, company=company, role=role))
            return "ok"
        except Exception as e:
            logger.error("Failed to store user info: %s", e)
            return "error"

    return update_user_info
